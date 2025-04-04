import { NextResponse } from "next/server";

const DB_URL = "http://localhost:3001/users"; // json-server endpoint

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // Check if email already exists
  const usersRes = await fetch(DB_URL);
  const users = await usersRes.json();

  if (users.some((user: any) => user.email === email)) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  // Save user to db.json
  const newUser = { id: Date.now(), email, password }; // Ideally, hash passwords!
  const saveRes = await fetch(DB_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newUser),
  });

  if (!saveRes.ok) {
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }

  return NextResponse.json({ message: "Signup successful" }, { status: 201 });
}
