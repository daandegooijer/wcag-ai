"use client";

import React, { useRef, useState } from "react";

type Props = {
  onSubmit: (text: string) => void;
  loading: boolean;
};

const onSubmit = async (text: string) => {};

const onGenerateTestText = () => {
  return "KLIK HIER voor MEER INFO over ONS AANBOD!!!\n WIJ GEBRUIKEN ROOD VOOR DINGEN DIE BELANGRIJK ZIJN en GROEN voor GOEDKEURING.\nwelkom op onze website wij hopen dat u hier alles kunt vinden wat u zoekt onze producten zijn speciaal ontworpen voor mensen die houden van stijl en gemak en comfort tegelijkertijd we hebben veel opties en mogelijkheden voor iedereen en we raden u aan om even goed rond te kijken en als u vragen heeft dan kunt u ons altijd contacteren via het formulier dat u op de homepage kunt vinden\n\nga naar de volgende pagina voor alles wat u moet weten over onze DIENSTEN  \nklik hier";
};

const Form: React.FC<Props> = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    const html = contentRef.current?.innerHTML || "";
    if (html) {
      setLoading(true);
      try {
        const res = await fetch("/api/prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: html }),
        });
        const data = await res.json();
        if (data.feedback) {
          setFeedback(data.feedback);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("No response from server.");
        }
      } catch (err) {
        setError("Error contacting the server.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[100px] rounded border border-gray-300 dark:border-gray-600 p-2 text-base bg-gray-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ marginBottom: 8 }}
        ></div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded"
            onClick={() => {
              if (contentRef.current) {
                contentRef.current.innerHTML =
                  "KLIK HIER voor MEER INFO over ONS AANBOD!!!<br><img src='https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg' alt='' style='max-width:200px;' /></br/>WIJ GEBRUIKEN <span style='color:red'>ROOD</span> VOOR DINGEN DIE BELANGRIJK ZIJN en <span style='color:green'>GROEN</span> voor GOEDKEURING.<br>welkom op onze website wij hopen dat u hier alles kunt vinden wat u zoekt onze producten zijn speciaal ontworpen voor mensen die houden van stijl en gemak en comfort tegelijkertijd we hebben veel opties en mogelijkheden voor iedereen en we raden u aan om even goed rond te kijken en als u vragen heeft dan kunt u ons altijd contacteren via het formulier dat u op de homepage kunt vinden<br><br>ga naar de volgende pagina voor alles wat u moet weten over onze DIENSTEN  klik hier";
              }
            }}
          >
            Generate bad text & image
          </button>

          <button
            type="submit"
            className="self-end bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Checking..." : "Check WCAG"}
          </button>
        </div>
      </form>
      {error && (
        <div className="mt-2 p-3 rounded bg-red-100 text-red-700 border border-red-200 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
      {feedback && (
        <div
          className="mt-2"
          aria-live="polite"
          dangerouslySetInnerHTML={{ __html: feedback }}
        />
      )}
    </>
  );
};

export default Form;
