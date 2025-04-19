import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const DB_URL = "http://localhost:3001/users";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const res = await fetch(`${DB_URL}?email=${email}`);
  const users = await res.json();

  if (users.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = users[0];

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  return NextResponse.json({ message: "Login successful", id: user.id });
}
