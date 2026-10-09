"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  candidateProfileSchema,
  type CandidateProfileInput,
} from "@/lib/validation/candidate-profile";

type CandidateProfileRecord = CandidateProfileInput & {
  id: string;
};

type ProfileFormValues = {
  name: string;
  headline: string;
  yearsExperience: string;
  currentRole: string;
  currentCompany: string;
  minimumSalaryLpa: string;
  targetSalaryLpa: string;
  preferredLocations: string;
  targetRoles: string;
  primarySkills: string;
  secondarySkills: string;
  companyPreferences: string;
  excludedKeywords: string;
};

const emptyProfile: ProfileFormValues = {
  name: "",
  headline: "",
  yearsExperience: "",
  currentRole: "",
  currentCompany: "",
  minimumSalaryLpa: "",
  targetSalaryLpa: "",
  preferredLocations: "",
  targetRoles: "",
  primarySkills: "",
  secondarySkills: "",
  companyPreferences: "",
  excludedKeywords: "",
};

function profileToForm(profile: CandidateProfileRecord): ProfileFormValues {
  return {
    name: profile.name,
    headline: profile.headline ?? "",
    yearsExperience: String(profile.yearsExperience),
    currentRole: profile.currentRole ?? "",
    currentCompany: profile.currentCompany ?? "",
    minimumSalaryLpa: String(profile.minimumSalaryLpa ?? ""),
    targetSalaryLpa: String(profile.targetSalaryLpa ?? ""),
    preferredLocations: profile.preferredLocations.join(", "),
    targetRoles: profile.targetRoles.join(", "),
    primarySkills: profile.primarySkills.join(", "),
    secondarySkills: profile.secondarySkills.join(", "),
    companyPreferences: profile.companyPreferences.join(", "),
    excludedKeywords: profile.excludedKeywords.join(", "),
  };
}

function toList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    let message = payload.error;
    if (
      "details" in payload &&
      payload.details &&
      typeof payload.details === "object" &&
      "fieldErrors" in payload.details &&
      payload.details.fieldErrors &&
      typeof payload.details.fieldErrors === "object"
    ) {
      const fieldMessages = Object.entries(payload.details.fieldErrors)
        .flatMap(([field, errors]) =>
          Array.isArray(errors)
            ? errors.filter((item): item is string => typeof item === "string").map(
                (item) => `${field}: ${item}`,
              )
            : [],
        )
        .join(" ");
      if (fieldMessages) {
        message = `${message}. ${fieldMessages}`;
      }
    }
    return message;
  }
  return fallback;
}

function TextField({
  label,
  name,
  value,
  onChange,
  type = "text",
  min,
  step,
  hint,
  required = true,
}: {
  label: string;
  name: keyof ProfileFormValues;
  value: string;
  onChange: (name: keyof ProfileFormValues, value: string) => void;
  type?: "text" | "number";
  min?: number;
  step?: number;
  hint?: string;
  required?: boolean;
}) {
  const id = `profile-${name}`;
  return (
    <label className="profile-field" htmlFor={id}>
      <span className="profile-field-label">{label}</span>
      <input
        autoComplete="off"
        id={id}
        max={type === "number" && name === "yearsExperience" ? 50 : undefined}
        min={min}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        step={step}
        type={type}
        value={value}
      />
      {hint && <span className="profile-field-hint">{hint}</span>}
    </label>
  );
}

function ListField({
  label,
  name,
  value,
  onChange,
  hint,
  required = false,
}: {
  label: string;
  name: keyof ProfileFormValues;
  value: string;
  onChange: (name: keyof ProfileFormValues, value: string) => void;
  hint: string;
  required?: boolean;
}) {
  const id = `profile-${name}`;
  return (
    <label className="profile-field" htmlFor={id}>
      <span className="profile-field-label">{label}</span>
      <input
        autoComplete="off"
        id={id}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder="e.g. React, TypeScript"
        required={required}
        type="text"
        value={value}
      />
      <span className="profile-field-hint">{hint}</span>
    </label>
  );
}

export default function ProfileForm() {
  const [values, setValues] = useState<ProfileFormValues>(emptyProfile);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await fetch("/api/candidate-profile", {
          signal: controller.signal,
        });
        const payload: unknown = await response.json();

        if (!response.ok) {
          throw new Error(
            getErrorMessage(payload, "Could not load your candidate profile."),
          );
        }

        if (
          payload &&
          typeof payload === "object" &&
          "data" in payload &&
          payload.data
        ) {
          const profileResult = candidateProfileSchema.safeParse(payload.data);
          if (
            profileResult.success &&
            typeof payload.data === "object" &&
            "id" in payload.data &&
            typeof payload.data.id === "string"
          ) {
            setValues(profileToForm({ ...profileResult.data, id: payload.data.id }));
            setProfileId(payload.data.id);
          } else {
            throw new Error("The saved candidate profile has an invalid format.");
          }
        }
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your candidate profile.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, []);

  function updateValue(name: keyof ProfileFormValues, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setError(null);
    setNotice(null);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const payload: CandidateProfileInput = {
      name: values.name.trim(),
      headline: values.headline.trim(),
      yearsExperience: Number(values.yearsExperience),
      currentRole: values.currentRole.trim(),
      currentCompany: values.currentCompany.trim(),
      minimumSalaryLpa: Number(values.minimumSalaryLpa),
      targetSalaryLpa: Number(values.targetSalaryLpa),
      preferredLocations: toList(values.preferredLocations),
      targetRoles: toList(values.targetRoles),
      primarySkills: toList(values.primarySkills),
      secondarySkills: toList(values.secondarySkills),
      companyPreferences: toList(values.companyPreferences),
      excludedKeywords: toList(values.excludedKeywords),
    };

    try {
      const response = await fetch("/api/candidate-profile", {
        method: profileId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "Could not save your candidate profile."),
        );
      }

      if (result && typeof result === "object" && "data" in result && result.data) {
        const profileResult = candidateProfileSchema.safeParse(result.data);
        if (
          profileResult.success &&
          typeof result.data === "object" &&
          "id" in result.data &&
          typeof result.data.id === "string"
        ) {
          setProfileId(result.data.id);
        } else {
          throw new Error("The saved profile response has an invalid format.");
        }
      }
      setNotice("Your candidate profile has been saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save your candidate profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="profile-form" onSubmit={saveProfile}>
      {error && (
        <div className="profile-feedback profile-feedback-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="profile-feedback profile-feedback-success" role="status">
          {notice}
        </div>
      )}

      <fieldset className="profile-fieldset" disabled={loading || saving}>
        <section className="profile-form-section">
          <div className="profile-form-section-heading">
            <span className="profile-section-number">01</span>
            <div>
              <h2>About you</h2>
              <p>Help us understand your experience and current role.</p>
            </div>
          </div>
          <div className="profile-form-grid">
            <TextField
              label="Full name"
              name="name"
              onChange={updateValue}
              value={values.name}
            />
            <TextField
              label="Professional headline"
              name="headline"
              onChange={updateValue}
              value={values.headline}
              hint="A short summary of the work you do."
            />
            <TextField
              label="Years of experience"
              name="yearsExperience"
              onChange={updateValue}
              type="number"
              min={0}
              step={1}
              value={values.yearsExperience}
            />
            <TextField
              label="Current role"
              name="currentRole"
              onChange={updateValue}
              value={values.currentRole}
            />
            <TextField
              label="Current company"
              name="currentCompany"
              onChange={updateValue}
              value={values.currentCompany}
            />
          </div>
        </section>

        <section className="profile-form-section">
          <div className="profile-form-section-heading">
            <span className="profile-section-number">02</span>
            <div>
              <h2>What you’re looking for</h2>
              <p>Tell us about your target roles, location, and salary range.</p>
            </div>
          </div>
          <div className="profile-form-grid">
            <ListField
              label="Target roles"
              name="targetRoles"
              onChange={updateValue}
              required
              value={values.targetRoles}
              hint="Separate each role with a comma."
            />
            <ListField
              label="Preferred locations"
              name="preferredLocations"
              onChange={updateValue}
              required
              value={values.preferredLocations}
              hint="Add cities, regions, or Remote."
            />
            <TextField
              label="Minimum salary (LPA)"
              name="minimumSalaryLpa"
              onChange={updateValue}
              type="number"
              min={0}
              step={0.1}
              value={values.minimumSalaryLpa}
            />
            <TextField
              label="Target salary (LPA)"
              name="targetSalaryLpa"
              onChange={updateValue}
              type="number"
              min={0}
              step={0.1}
              value={values.targetSalaryLpa}
            />
          </div>
        </section>

        <section className="profile-form-section">
          <div className="profile-form-section-heading">
            <span className="profile-section-number">03</span>
            <div>
              <h2>Your preferences</h2>
              <p>Use commas between items. Optional fields can be left blank.</p>
            </div>
          </div>
          <div className="profile-form-grid">
            <ListField
              label="Primary skills"
              name="primarySkills"
              onChange={updateValue}
              required
              value={values.primarySkills}
              hint="Your strongest or most relevant skills."
            />
            <ListField
              label="Secondary skills"
              name="secondarySkills"
              onChange={updateValue}
              value={values.secondarySkills}
              hint="Other skills you’d like to highlight."
            />
            <ListField
              label="Company preferences"
              name="companyPreferences"
              onChange={updateValue}
              value={values.companyPreferences}
              hint="For example: product companies, startups."
            />
            <ListField
              label="Keywords to exclude"
              name="excludedKeywords"
              onChange={updateValue}
              value={values.excludedKeywords}
              hint="Roles or terms you don’t want to see."
            />
          </div>
        </section>
      </fieldset>

      <div className="profile-form-footer">
        <p>Your profile is only used to personalize job discovery and matches.</p>
        <button className="button button-primary" disabled={loading || saving}>
          {loading ? "Loading profile…" : saving ? "Saving profile…" : profileId ? "Save changes" : "Create profile"}
          {!loading && !saving && <span aria-hidden="true">↗</span>}
        </button>
      </div>
    </form>
  );
}
