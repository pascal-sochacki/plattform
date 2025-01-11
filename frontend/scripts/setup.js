const keycloakUrl = "http://127.0.0.1:8080";
const realm = "plattform";
const adminUsername = "admin";
const adminPassword = "admin";

const username = "pascal";
const password = "pascal";
const email = "pascal@sochacki.dev";

async function createUser(username, passsword, email, token) {
  const response = await fetch(`${keycloakUrl}/admin/realms/${realm}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      credentials: [
        {
          type: "passsword",
          temporary: false,
          value: passsword,
        },
      ],
      email: email,
      enabled: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(error);
    return;
  }
}

(async () => {
  const token = await fetch(
    `${keycloakUrl}/realms/master/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=password&username=${adminUsername}&password=${adminPassword}&client_id=admin-cli`,
    },
  ).then((res) => res.json());

  await createUser(username, password, email, token);
})();
