import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAgreementPDF } from "@/lib/pdf-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: { publicSlug: string } }
) {
  try {
    const agreement = await prisma.agreement.findUnique({
      where: { publicSlug: params.publicSlug },
      include: {
        user: {
          select: {
            businessName: true,
            country: true,
          },
        },
        auditEvents: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
    }

    const pdfBuffer = await generateAgreementPDF(agreement);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="agreement-${agreement.publicSlug}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

