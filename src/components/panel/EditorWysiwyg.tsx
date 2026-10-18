"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import "jodit/es2021/jodit.min.css";

const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => <p className="campo-hint">Cargando el editor…</p>,
});

interface EditorWysiwygProps {
  valor: string;
  onChange: (html: string) => void;
  altura?: number;
  id?: string;
  placeholder?: string;
}

export default function EditorWysiwyg({ valor, onChange, altura = 420, id, placeholder }: EditorWysiwygProps) {
  const config = useMemo(
    () => ({
      language: "es" as const,
      height: altura,
      placeholder: placeholder ?? "Escribe aquí el contenido del artículo…",
      showXPathInStatusbar: false,
      askBeforePasteFromWord: false,
      buttons: [
        "bold",
        "italic",
        "underline",
        "strike",
        "|",
        "ul",
        "ol",
        "|",
        "h2",
        "h3",
        "paragraph",
        "|",
        "link",
        "unlink",
        "image",
        "|",
        "align",
        "indent",
        "outdent",
        "|",
        "hr",
        "eraser",
        "source",
      ],
      removeButtons: ["about"],
      showCharsCounter: false,
      showWordsCounter: false,
      allowTags: {
        script: false,
      },
    }),
    [altura, placeholder],
  );

  return (
    <JoditEditor
      value={valor}
      config={config}
      onChange={(nuevo: string) => onChange(nuevo)}
    />
  );
}
