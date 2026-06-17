import { useRef, useState } from "react"
import Card from "./components/Card";

export type Data = {
  fileName: string;
  mimeType: string;
  size: string;
  date: string;
  url: string;
};
type StandardResponse = {
  data: Data[];
  meta: {
    pagination: {
      currentPage: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    queryStats: {
      processingTimeMs: number;
    };
  };
};


function App() {
  const searchRef = useRef<HTMLInputElement>(null)
  const [hubcloud, setHubcloud] = useState<Data[] | null>(null)

  const fetchData = async () => {
    const search = searchRef.current?.value
    const url = `/api/search/hubcloud?q=${search}`
    const res = await fetch(url)
    const data: StandardResponse = await res.json();
    setHubcloud(data.data)
  }

  return (
    <div className="w-full mx-auto md:max-w-7xl px-1.5">
      <div className="flex text-3xl py-1">
        <input ref={searchRef} type="text" id="search" className="flex-1"/>
        <button onClick={fetchData} className="bg-gray-400 p-3 rounded-2xl">Go</button>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {hubcloud &&
          hubcloud.map((data, idx) => (
            <Card key={idx} data={data}/>
          ))
        }
      </div>
    </div>
  )
}

export default App
