export interface FearGreedData {
  value: number;
  label: string;
}

export async function getFearGreedIndex(): Promise<FearGreedData> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return { value: 50, label: "Neutral" };
    }

    const data = await res.json();
    const latest = data.data?.[0];

    return {
      value: parseInt(latest?.value ?? "50"),
      label: latest?.value_classification ?? "Neutral",
    };
  } catch {
    return { value: 50, label: "Neutral" };
  }
}
