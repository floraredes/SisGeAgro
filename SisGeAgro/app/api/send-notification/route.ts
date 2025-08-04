import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { to, subject, text, html } = await req.json();

  if (!to || !subject || !text) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  // Configura el transporter con tus credenciales de Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER, // tu email de gmail
      pass: process.env.GMAIL_PASS, // tu contraseña o contraseña de aplicación
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"SisGeAgro" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    return NextResponse.json({ success: true, info });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error enviando email" }, { status: 500 });
  }
}