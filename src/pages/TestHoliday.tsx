import { useEffect, useState } from "react";

export default function TestHoliday() {
  const [holidays, setHolidays] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch("https://holidays-jp.github.io/api/v1/date.json");
        const data = await res.json();
        console.log("祝日データ取得テスト", data);
        setHolidays(data);
      } catch (err) {
        console.error("祝日データ取得エラー", err);
      }
    };

    fetchHolidays();
  }, []);

  return (
    <div>
      <h1>祝日データテスト</h1>
      <pre>{JSON.stringify(holidays, null, 2)}</pre>
    </div>
  );
}
