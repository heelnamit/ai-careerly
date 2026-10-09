import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { candidateProfileSchema } from "@/lib/validation/candidate-profile";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = candidateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid candidate profile",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const profile = await prisma.candidateProfile.create({
      data: result.data,
    });

    return NextResponse.json(
      {
        success: true,
        data: profile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Candidate profile creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create candidate profile",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const profile = await prisma.candidateProfile.findFirst();

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Candidate profile fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch candidate profile",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const result = candidateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid candidate profile",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existingProfile =
      await prisma.candidateProfile.findFirst();

    if (!existingProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "Candidate profile not found",
        },
        { status: 404 }
      );
    }

    const profile = await prisma.candidateProfile.update({
      where: {
        id: existingProfile.id,
      },
      data: result.data,
    });

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Candidate profile update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update candidate profile",
      },
      { status: 500 }
    );
  }
}