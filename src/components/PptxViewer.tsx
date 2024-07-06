import React, { useState } from "react";
import JSZip from "jszip";

const PptxViewer: React.FC = () => {
  const [slides, setSlides] = useState<string[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (arrayBuffer) {
          const newSlides = await parsePPTX(arrayBuffer);
          setSlides(newSlides);
          setCurrentSlideIndex(0);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const parsePPTX = async (arrayBuffer: ArrayBuffer): Promise<string[]> => {
    const filesMap = await extractZip(arrayBuffer);
    const slideFiles = Array.from(filesMap.keys()).filter((fileName) =>
      fileName.startsWith("ppt/slides/slide")
    );
    const slideContents: string[] = [];

    for (const fileName of slideFiles) {
      const slideContent = filesMap.get(fileName);
      if (slideContent) {
        const decoder = new TextDecoder("utf-8");
        const xmlString = decoder.decode(slideContent);
        slideContents.push(xmlString);
      }
    }
    return slideContents;
  };

  const extractZip = (
    arrayBuffer: ArrayBuffer
  ): Promise<Map<string, ArrayBuffer>> => {
    return new Promise((resolve, reject) => {
      const filesMap = new Map<string, ArrayBuffer>();
      const zip = new JSZip();
      zip
        .loadAsync(arrayBuffer)
        .then((content) => {
          const filePromises = Object.keys(content.files).map((fileName) => {
            const file = content.file(fileName);
            if (file) {
              return file
                .async("arraybuffer")
                .then((data) => filesMap.set(fileName, data));
            }
            return Promise.resolve();
          });
          Promise.all(filePromises)
            .then(() => resolve(filesMap))
            .catch(reject);
        })
        .catch(reject);
    });
  };

  const displaySlide = (xmlString: string): JSX.Element => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const textNodes = xmlDoc.getElementsByTagName("a:t");
    const paragraphs = [];
    for (let i = 0; i < textNodes.length; i++) {
      paragraphs.push(<p key={i}>{textNodes[i].textContent}</p>);
    }
    return <div className="slide">{paragraphs}</div>;
  };

  const nextSlide = () => {
    setCurrentSlideIndex((prevIndex) =>
      Math.min(prevIndex + 1, slides.length - 1)
    );
  };

  const previousSlide = () => {
    setCurrentSlideIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  return (
    <div>
      <input type="file" onChange={handleFileInput} />
      <div id="pptxContainer">
        {slides.length > 0 && (
          <React.Fragment>
            {displaySlide(slides[currentSlideIndex])}
            <div className="navigation">
              <button
                onClick={previousSlide}
                disabled={currentSlideIndex === 0}
              >
                Previous
              </button>
              <button
                onClick={nextSlide}
                disabled={currentSlideIndex === slides.length - 1}
              >
                Next
              </button>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

export default PptxViewer;
