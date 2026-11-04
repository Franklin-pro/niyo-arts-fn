type CountryNowRecord = { name: string; capital: string };

function isCountryNowResponse(value: unknown): value is { error: boolean; data: CountryNowRecord[] } {
  if (!value || typeof value !== "object" || !("error" in value) || !("data" in value)) return false;
  const response = value as { error?: unknown; data?: unknown };
  return response.error === false &&
    Array.isArray(response.data) &&
    response.data.every((country) =>
      country !== null &&
      typeof country === "object" &&
      "name" in country &&
      typeof country.name === "string" &&
      "capital" in country &&
      typeof country.capital === "string"
    );
}

export async function GET() {
  let response: Response;
  try {
    response = await fetch("https://countriesnow.space/api/v0.1/countries/capital", {
      next: { revalidate: 86400 },
    });
  } catch {
    return Response.json({ message: "Unable to reach the country data service." }, { status: 502 });
  }

  if (!response.ok) {
    return Response.json(
      { message: `Country data service returned ${response.status}.` },
      { status: 502 },
    );
  }

  const result: unknown = await response.json().catch(() => null);
  if (!isCountryNowResponse(result)) {
    return Response.json({ message: "Country data service returned invalid data." }, { status: 502 });
  }

  const data = result.data
    .map((country) => ({ name: country.name.trim(), capital: country.capital.trim() }))
    .filter((country) => country.name.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!data.length) {
    return Response.json({ message: "Country data service returned no countries." }, { status: 502 });
  }

  return Response.json({ data }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
