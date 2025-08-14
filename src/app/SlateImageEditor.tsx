"use client";
import React, { useMemo, useCallback } from "react";
import {
  createEditor,
  Descendant,
  Transforms,
  Element as SlateElement,
} from "slate";
import { Slate, Editable, withReact, useSlate, ReactEditor } from "slate-react";

const initialValue: Descendant[] = [
  {
    type: "paragraph",
    children: [{ text: "Paste or write your content here..." }],
  },
];

const ImageElement = ({ attributes, children, element }: any) => {
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <img
          src={element.url}
          alt={element.alt || ""}
          style={{ maxWidth: "100%", margin: "8px 0" }}
        />
      </div>
      {children}
    </div>
  );
};

const insertImage = (editor: ReactEditor, url: string, alt: string) => {
  const image = { type: "image", url, alt, children: [{ text: "" }] };
  Transforms.insertNodes(editor, image);
};

const Toolbar = () => {
  const editor = useSlate();
  const onClick = () => {
    const url = window.prompt("Enter the image URL (e.g. badname.png):");
    const alt = window.prompt(
      "Enter the alt text (leave empty for bad alt):",
      ""
    );
    if (url) {
      insertImage(editor as any, url, alt || "");
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded mr-2 mb-2"
    >
      Insert Image
    </button>
  );
};

const renderElement = (props: any) => {
  switch (props.element.type) {
    case "image":
      return <ImageElement {...props} />;
    default:
      return <p {...props.attributes}>{props.children}</p>;
  }
};

export default function SlateImageEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (data: string) => void;
}) {
  const editor = useMemo(() => withReact(createEditor()), []);

  const safeParse = (val: string | undefined): Descendant[] => {
    if (!val) return initialValue;
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].children) {
        return parsed;
      }
      return initialValue;
    } catch {
      return initialValue;
    }
  };

  const [internalValue, setInternalValue] = React.useState<Descendant[]>(
    safeParse(value)
  );

  // Update internalValue if value prop changes (e.g. when clicking 'insert bad text/image')
  React.useEffect(() => {
    setInternalValue(safeParse(value));
  }, [value]);

  const handleChange = useCallback(
    (val: Descendant[]) => {
      setInternalValue(val);
      onChange(JSON.stringify(val));
    },
    [onChange]
  );

  return (
    <div className="w-full border rounded p-2 bg-white dark:bg-zinc-900">
      <Slate
        editor={editor}
        initialValue={internalValue}
        onChange={handleChange}
      >
        <Editable
          renderElement={renderElement}
          placeholder="Paste or write your content here..."
          spellCheck
          autoFocus
          style={{ minHeight: "500px" }}
        />
      </Slate>
    </div>
  );
}
