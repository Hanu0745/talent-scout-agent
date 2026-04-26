const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

export async function scoutCandidates(jobDescription) {
  const res = await fetch(`${BASE_URL}/api/scout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobDescription }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}
