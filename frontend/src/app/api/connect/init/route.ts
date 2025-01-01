import { cookies } from "next/headers";
import GitlabProvider from "next-auth/providers/gitlab";
import { base64url, EncryptJWT } from "jose";
import { env } from "~/env";
import { NextResponse } from "next/server";
import { auth } from "~/server/auth";

export async function GET(request: Request) {
  const session = await auth();
  console.log(session);
  if (session == null) {
    return NextResponse.json(
      {
        message: "not logged in",
        status: 400,
      },
      {
        status: 400,
      },
    );
  }

  const secret = base64url.decode(env.SECRET);

  const url = new URL(request.url);
  const origin = url.searchParams.get("origin");
  const jwt = await new EncryptJWT({
    user: session.user,
    origin: origin ?? "/app",
  })
    .setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256" })
    .encrypt(secret);

  const cookieStore = await cookies();

  const gitlab = GitlabProvider({});
  const gitlabUrl = new URL(gitlab.authorization as string);
  const authParams = gitlabUrl.searchParams;
  const redirect_uri = "http://localhost:3000/api/connect";

  const params = Object.assign(
    {
      response_type: "code",
      client_id: env.AUTH_GITLAB_ID,
      state: jwt,
      redirect_uri,
    },
    Object.fromEntries(authParams),
  );
  for (const k in params) {
    authParams.set(k, params[k]!);
  }

  cookieStore.set("gitlab-state", jwt);
  return NextResponse.redirect(gitlabUrl);
}
