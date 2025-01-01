import { base64url, jwtDecrypt } from "jose";
import { type DefaultSession } from "next-auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "~/env";
import { auth } from "~/server/auth";
import GitlabProvider from "next-auth/providers/gitlab";
import { z } from "zod";
import { db } from "~/server/db";
import { gitlabAccount } from "~/server/db/schema";

function BadRequest(message: string) {
  return NextResponse.json(
    {
      message: message,
      status: 400,
    },
    {
      status: 400,
    },
  );
}
const tokenResponse = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
  created_at: z.number(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (session == null) {
    return BadRequest("not logged in");
  }

  const url = new URL(request.url);

  const state = url.searchParams.get("state");
  if (state == null) {
    return BadRequest("miss url param");
  }
  const code = url.searchParams.get("code");
  if (code == null) {
    return BadRequest("miss code param");
  }

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("gitlab-state");
  if (stateCookie == undefined) {
    return BadRequest("miss cookie");
  }

  if (stateCookie.value != state) {
    return BadRequest("missmatch");
  }
  const secret = base64url.decode(env.SECRET);
  const jwt = await jwtDecrypt(state, secret);
  const stateUser = jwt.payload.user as {
    id: string;
  } & DefaultSession["user"];

  if (session.user.id != stateUser.id) {
    return BadRequest("user dont match");
  }

  const gitlab = GitlabProvider({});
  const tokenUrl = new URL(gitlab.token as string);
  tokenUrl.searchParams.set("client_id", env.AUTH_GITLAB_ID);
  tokenUrl.searchParams.set("client_secret", env.AUTH_GITLAB_SECRET);
  tokenUrl.searchParams.set("code", code);
  tokenUrl.searchParams.set("grant_type", "authorization_code");
  tokenUrl.searchParams.set(
    "redirect_uri",
    "http://localhost:3000/api/connect",
  );

  const response = await fetch(tokenUrl, { method: "POST" });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const token = await tokenResponse.parseAsync(await response.json());
  await db
    .insert(gitlabAccount)
    .values({
      userId: session.user.id,
      ...token,
    })
    .onConflictDoUpdate({
      target: gitlabAccount.userId,
      set: token,
    });
  console.log(jwt.payload.origin);
  const originURL = new URL(
    (jwt.payload.origin as string) ?? "/app",
    request.url,
  );

  return NextResponse.redirect(originURL);
}
