import { clsx } from "clsx";

export function cn(...parts: Array<string | false | null | undefined>) {
  return clsx(parts);
}

export function formatDateTime(date: string | Date) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

export function truncateText(text: string, length = 120) {
  if (text.length <= length) {
    return text;
  }
  return `${text.slice(0, length).trim()}...`;
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}
