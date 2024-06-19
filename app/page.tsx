"use client";

import { useState } from "react";
import Image from "next/image";
import qrcode from "qrcode";
import toast from "react-hot-toast";

export default function Home() {
  const initailData = "/default.png";
  const [data, setData] = useState("");

  const [url, setUrl] = useState(initailData);

  const handleChange = async (data: string) => {
    setData(data);
    if (data.length === 0) return setUrl(initailData);
    const url = await qrcode.toDataURL(data);

    setUrl(url);
  };

  return (
    <main className="flex flex-col bg-gray-300 space-y-6 justify-center items-center h-screen w-full px-2 md:px-4 lg:px-8">
      <h1 className="text-2xl  font-medium">Free QR Code Generator</h1>
      <input
        type="text"
        value={data}
        onChange={(d) => handleChange(d.target.value)}
        placeholder="Enter url"
        className="flex px-4 py-2 border-2 w-full md:w-2/4 border-gray-300  rounded"
      />

      <Image src={url} alt="QR Code" width={250} height={250} priority={true} />
      {data.length > 0 && data != initailData ? (
        <a
          href={url}
          download="qrcode.png"
          onClick={() => toast.success("QR Code downloaded successfully")}
          className="bg-black text-white px-6 py-2 rounded"
        >
          Download
        </a>
      ) : (
        <button className="bg-gray-600 cursor-not-allowed text-white px-6 py-2 rounded">
          Download
        </button>
      )}
    </main>
  );
}
