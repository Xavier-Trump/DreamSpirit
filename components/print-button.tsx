"use client";

export function PrintButton() {
  return (
    <button className="button button-primary" type="button" onClick={() => window.print()}>
      打印 / 保存 PDF
    </button>
  );
}
