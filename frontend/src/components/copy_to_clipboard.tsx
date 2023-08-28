import { useState, useEffect } from 'react';
import { Copy } from "@/components/icons/copy";
import { Check } from "@/components/icons/check";

const CopyToClipboardText = ({ text, ...props }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => {
                setCopied(false);
            }, 2000);

            return () => {
                clearTimeout(timer);
            };
        }
    }, [copied]);

    const copyText = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
    };

    return (
        <span className="text-sky-600 cursor-pointer" {...props} onClick={copyText}>
            {text} {copied ? <Check className="inline text-green-700"/> : <Copy className="inline"/>}
        </span>
    );
};

export default CopyToClipboardText;
