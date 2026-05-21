// app/api/revalidate/route.js
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export async function POST(request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    const expected = process.env.REVALIDATE_SECRET;

    // Reject immediately if either value is missing or lengths differ —
    // timingSafeEqual requires equal-length buffers.
    if (
        !secret ||
        !expected ||
        secret.length !== expected.length ||
        !timingSafeEqual(Buffer.from(secret), Buffer.from(expected))
    ) {
        return NextResponse.json(
            { message: "Invalid secret" },
            { status: 401 }
        );
    }

    revalidateTag("menu");

    return NextResponse.json({
        revalidated: true,
        tag: "menu",
        timestamp: new Date().toISOString(),
    });
}