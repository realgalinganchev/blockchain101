import { useCallback, useEffect } from "react";

export const useFetchData = <T extends unknown>(
  url: string,
  setData: React.Dispatch<React.SetStateAction<T>>
) => {
  const fetchData = useCallback(() => {
    fetch(url)
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(`HTTP error! status: ${res.status}`)
      )
      .then(setData)
      .catch((error) => console.log("Fetch operation error:", error));
  }, [url, setData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return fetchData;
};
