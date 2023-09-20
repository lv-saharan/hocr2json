export function parseNode(node) {
  const title = node.title;
  const props = {
    id: node.id,
  };
  title.split(";").forEach((s) => {
    const [name, ...values] = s.trim().split(/\s/);
    switch (name) {
      case "image":
        props[name] = values.join();
        break;
      case "bbox":
        props[name] = {
          x1: parseFloat(values[0]),
          y1: parseFloat(values[1]),
          x2: parseFloat(values[2]),
          y2: parseFloat(values[3]),
        };
        props[name].width = props[name].x2 - props[name].x1;
        props[name].height = props[name].y2 - props[name].y1;

        Object.assign(props, props[name]);

        break;
      case "ppageno":
        props[name] = parseInt(values[0]);
        break;
      case "x_size":
      case "x_descenders":
      case "x_ascenders":
      case "x_wconf":
        props[name] = parseFloat(values[0]);
        break;
      case "scan_res":
      case "baseline":
        props[name] = {
          x: parseFloat(values[0]),
          y: parseFloat(values[1]),
        };
        break;
    }
  });
  if (node.lang) {
    props.lang = node.lang;
  }
  return props;
}

export function toJSON(hocrContent) {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);
  const hocrDoc = iframe.contentDocument;
  hocrDoc.open();
  hocrDoc.write(hocrContent);
  hocrDoc.close();

  const docEle = hocrDoc.documentElement;
  const json = {
    lang: docEle.lang,
    "ocr-system": hocrDoc.querySelector("meta[name=ocr-system]")?.content,
    "ocr-capabilities": hocrDoc.querySelector("meta[name=ocr-capabilities]")
      ?.content,
    pages: [...hocrDoc.querySelectorAll(".ocr_page")].map((ocrPage) => {
      //页
      const page = parseNode(ocrPage);
      //区域
      page.areas = [...ocrPage.children].map((ocrArea) => {
        const area = parseNode(ocrArea);
        //段落
        area.pars = [...ocrArea.children].map((ocrPar) => {
          const par = parseNode(ocrPar);
          //行
          par.lines = [...ocrPar.children].map((ocrLine) => {
            const line = parseNode(ocrLine);
            //词
            line.words = [...ocrLine.children].map((ocrWord) => {
              const word = parseNode(ocrWord);
              word.text = ocrWord.textContent;
              return word;
            });
            return line;
          });
          return par;
        });
        return area;
      });
      return page;
    }),
  };

  iframe.remove();
  return json;
}
