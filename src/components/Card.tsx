import type { Data } from "../App"

const Card = ({ data }: { data: Data }) => {
    return (
        <div className="border rounded-md p-4">
            <div>
                <h1>{data.fileName}</h1>
            </div>
            <div className="flex gap-5 items-center">
                <p>{data.size}</p>
                <a href={data.url} target="_blank" className="bg-gray-200 p-2 rounded-md">Hubcloud</a>
            </div>
        </div>
    )
}

export default Card