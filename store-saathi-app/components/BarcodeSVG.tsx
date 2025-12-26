import { useEffect, useState } from "react";
import { SvgXml } from "react-native-svg";
import bwipjs from "bwip-js";

type Props = {
  value: string;
  height?: number;
};

export default function BarcodeSVG({ value, height = 40 }: Props) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;

    try {
      const svgText = bwipjs.toSVG({
        bcid: "code128",
        text: value,
        scale: 2,
        height,
        includetext: false,
        backgroundcolor: "FFFFFF",
      });

      setSvg(svgText);
    } catch (e) {
      console.log("Barcode SVG error:", e);
    }
  }, [value, height]);

  if (!svg) return null;

  return <SvgXml xml={svg} width="100%" height={height} />;
}
