<p align="center">
  <img src="../../logo/logo.png" width="80" alt="Loophole" />
</p>

<h1 align="center">Loophole IDE</h1>

<p align="center">
ओपन-सोर्स AI कोड एडिटर जो कोडिंग के दौरान सोचता है।
</p>

<div align="center">

<img src="https://img.shields.io/github/license/loophole-ai/loophole-ide?style=for-the-badge" alt="License" />
<img src="https://img.shields.io/github/stars/loophole-ai/loophole-ide?style=for-the-badge" alt="Stars" />
<img src="https://img.shields.io/github/issues/loophole-ai/loophole-ide?style=for-the-badge" alt="Issues" />

</div>

<div align="center">

<table>
<tbody>
<td align="center"><a href="https://www.loopholeeditor.in"><strong>Loophole</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide"><strong>GitHub</strong></a></td>
<td align="center"><a href="../../LOOPHOLE_CODEBASE_GUIDE.md"><strong>दस्तावेज़</strong></a></td>
<td align="center"><a href="../../HOW_TO_CONTRIBUTE.md"><strong>योगदान करें</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/issues"><strong>समस्याएं</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/discussions"><strong>चर्चा</strong></a></td>
</tbody>
</table>

</div>

<br>

<p align="center">
  <img src="../../logo/20260327_123134.png" width="100%" alt="Loophole Editor" />
</p>

Loophole एक पूरी तरह से ओपन-सोर्स AI-नेटिव कोड एडिटर है जिसे Void Editor से फोर्क किया गया है (जो स्वयं VS Code का फोर्क है)। यह एडिटर के सबसे गहरे स्तर पर AI क्षमताओं को एकीकृत करता है — प्लगइन के रूप में नहीं, बल्कि संपादन अनुभव के मूल भाग के रूप में। सभी कोड आपकी मशीन पर ही रहता है।

AI अनुरोध **सीधे आपकी मशीन से आपके चुने हुए प्रदाता को भेजे जाते हैं**। आपका कोड कभी भी Loophole सर्वर से नहीं गुजरता। आप अपनी खुद की API कुंजी लाएं या स्थानीय मॉडल चलाएं, और Loophole बाकी सब संभाल लेता है।

यह एक पूर्ण एजेंटिक इंजन, इनलाइन ऑटोकम्पलीट, चार-मोड AI चैट साइडबार, Quick Edit, AI-जनित Git कमिट संदेश, वॉइस इनपुट, टोकन उपयोग और लागत ट्रैकिंग, MCP सर्वर समर्थन, और प्रति-फीचर मॉडल असाइनमेंट सिस्टम के साथ आता है।

## Loophole क्यों चुनें

- **आर्किटेक्चर द्वारा गोपनीयता, नीति द्वारा नहीं।** हर AI अनुरोध सीधे आपकी मशीन से प्रदाता के सार्वजनिक API पर जाता है। कोई Loophole बैकएंड नहीं, कोई प्रॉम्प्ट लॉगिंग नहीं, कोई मध्यस्थ रिले नहीं।
- **चार प्रकार के काम के लिए चार चैट मोड।** Normal मोड प्रश्नों का संवादात्मक उत्तर देता है। Gather मोड AI को किसी फाइल को छुए बिना आपके कोडबेस को पढ़ने और खोजने देता है। Plan मोड AI को कुछ भी चलाने से पहले बहु-चरणीय योजना बनाने देता है। Agent मोड AI को फाइलों को पढ़ने, लिखने, कमांड चलाने और स्वायत्त रूप से उप-एजेंट बनाने की पूरी टूल पहुंच देता है।
- **एक वास्तविक एजेंटिक टूल सरफेस।** एजेंट पेजिनेशन के साथ फाइलें पढ़ सकता है, सर्जिकल SEARCH/REPLACE संपादन कर सकता है, पूरी फाइलें फिर से लिख सकता है, फाइलें और फोल्डर बना और हटा सकता है, पथ का नाम बदल और स्थानांतरित कर सकता है, टर्मिनल कमांड चला सकता है, और MCP टूल कॉल कर सकता है।
- **समानांतर उप-एजेंट।** एजेंट स्वतंत्र उप-कार्यों को एक साथ संभालने के लिए `general` (पूर्ण टूल) या `researcher` (केवल-पढ़ें) उप-एजेंट बना सकता है।
- **गति के लिए बनाया गया ऑटोकम्पलीट।** इनलाइन कम्पलीशन इंजन Fill-In-the-Middle दृष्टिकोण का उपयोग करता है, कर्सर से पहले और बाद का कोड भेजता है ताकि मॉडल ठीक वही भविष्यवाणी करे जो बीच में होनी चाहिए।
- **प्रति-फीचर मॉडल असाइनमेंट।** Chat, Quick Edit (Ctrl+K), Autocomplete, Apply और Git कमिट संदेश जनरेशन के अपने-अपने मॉडल स्लॉट हैं। चैट के लिए शक्तिशाली reasoning मॉडल और ऑटोकम्पलीट के लिए तेज़ सस्ता मॉडल उपयोग करें।
- **20+ प्रदाता, पूरी तरह स्थानीय सहित।** Anthropic, OpenAI, Google Gemini, DeepSeek, xAI, Mistral, Groq, Cohere, Perplexity, OpenRouter, Together AI, Fireworks AI, Inception Labs, LiteLLM, Vertex AI, Azure, AWS Bedrock, Ollama, vLLM, LM Studio और OpenAI-संगत एंडपॉइंट।
- **Reasoning मॉडल समर्थन।** जब कोई मॉडल विस्तारित सोच का समर्थन करता है, तो Loophole उसे सही तरीके से कॉन्फ़िगर करता है: Anthropic-शैली reasoning के लिए बजट स्लाइडर, OpenAI-शैली के लिए प्रयास स्लाइडर।
- **MCP सर्वर समर्थन।** कस्टम टूल के साथ एजेंट को विस्तारित करने के लिए बाहरी Model Context Protocol सर्वर कनेक्ट करें।
- **टोकन उपयोग और लागत ट्रैकिंग।** हर प्रतिक्रिया इनपुट टोकन, आउटपुट टोकन और प्रति-प्रदाता मूल्य निर्धारण के आधार पर अनुमानित USD लागत रिकॉर्ड करती है।
- **AI कमिट संदेश।** Git SCM पैनल में एक AI बटन है जो आपके स्टेज्ड diff को कॉन्फ़िगर किए गए SCM मॉडल को भेजता है और कमिट संदेश सीधे Git इनपुट बॉक्स में स्ट्रीम करता है।
- **वॉइस इनपुट।** आप माइक्रोफोन का उपयोग करके चैट में संदेश बोल सकते हैं। Loophole PCM ऑडियो कैप्चर करता है, प्रदाता के माध्यम से ट्रांसक्राइब करता है, और परिणाम चैट इनपुट में भर देता है।
- **अनुमोदन नियंत्रण।** फाइल संपादन, टर्मिनल कमांड और MCP टूल कॉल की अपनी-अपनी अनुमोदन श्रेणी है। आप प्रति श्रेणी मैन्युअल पुष्टि की आवश्यकता कर सकते हैं या सेटिंग्स में वैश्विक रूप से ऑटो-अप्रूव सक्षम कर सकते हैं।

## समर्थित प्रदाता

| प्रदाता | विवरण |
|----------|-------|
| Anthropic | Claude मॉडल, स्ट्रीमिंग, reasoning समर्थन |
| OpenAI | GPT और o-सीरीज़ मॉडल |
| Google Gemini | Gemini Flash और Pro, नेटिव Gemini मैसेज फॉर्मेट |
| DeepSeek | DeepSeek V4 Pro और Flash |
| xAI | Grok मॉडल reasoning वेरिएंट सहित |
| Mistral | Mistral Large, Magistral, Codestral, Devstral |
| Groq | अति-तेज़ अनुमान |
| Cohere | Command मॉडल reasoning सहित |
| Perplexity | वेब सर्च के साथ Sonar मॉडल |
| OpenRouter | एकल API कुंजी के माध्यम से 200+ मॉडल |
| Together AI | ओपन-सोर्स मॉडल होस्टिंग |
| Fireworks AI | तेज़ ओपन-सोर्स अनुमान |
| Inception Labs | Mercury diffusion मॉडल, ऑटोकम्पलीट के लिए FIM-ऑप्टिमाइज़ |
| LiteLLM | OpenAI-संगत प्रॉक्सी लेयर |
| Google Vertex AI | OpenAI-संगत एंडपॉइंट के माध्यम से एंटरप्राइज़ Google AI |
| Microsoft Azure | Azure AI Foundry और Azure OpenAI |
| AWS Bedrock | Amazon-प्रबंधित AI मॉडल |
| Ollama | स्थानीय मॉडल रनर, ऑटो-डिटेक्ट |
| vLLM | स्थानीय उच्च-प्रदर्शन अनुमान, ऑटो-डिटेक्ट |
| LM Studio | स्थानीय GUI मॉडल रनर, ऑटो-डिटेक्ट |
| OpenAI Compatible | किसी भी कस्टम एंडपॉइंट के साथ OpenAI-संगत API |

## स्रोत से बनाएं

आवश्यकताएं: Node.js 22 या उससे अधिक, Python और C++ बिल्ड टूल।

```bash
git clone https://github.com/loophole-ai/loophole-ide.git
cd loophole-ide

npm install
npm run buildreact

# एक टर्मिनल में
npm run watch

# दूसरे टर्मिनल में
npm run electron
```

## प्रोजेक्ट संरचना

सभी AI-विशिष्ट कोड `src/vs/workbench/contrib/void/` के अंतर्गत है। `browser/` लेयर में ऑटोकम्पलीट इंजन, कॉन्टेक्स्ट गैदरिंग सर्विस, SCM इंटीग्रेशन, साइडबार और Quick Edit पेन्स, और सभी React UI कंपोनेंट हैं। `common/` लेयर शेयर्ड टाइप्स और कॉन्स्टेंट परिभाषित करती है। `electron/` लेयर Electron इंटीग्रेशन और सिस्टम इंटीग्रेशन संभालती है।

`extensions/` डायरेक्टरी में सभी मानक VS Code बिल्ट-इन एक्सटेंशन और `theme-loophole` (Loophole का कस्टम डार्क थीम) शामिल हैं। `cli/` डायरेक्टरी में Rust-आधारित CLI टूलिंग है।

## AI अनुरोध कैसे प्रवाहित होते हैं

एक उपयोगकर्ता क्रिया — चैट संदेश भेजना, Ctrl+K दबाना, या एडिटर में टाइप करना — संबंधित सेवा को ट्रिगर करती है। वह सेवा खुली फाइलों, वर्तमान चयन, git इतिहास और सक्रिय टर्मिनल से कॉन्टेक्स्ट असेंबल करने के लिए `contextGatheringService` को कॉल करती है। असेंबल किया गया कॉन्टेक्स्ट एजेंट को भेजा जाता है, जो बहु-राउंड एजेंटिक लूप निष्पादित करता है। एजेंट क्रियाएं (संपादन, फाइल निर्माण, शेल कमांड, MCP टूल कॉल) निष्पादन या अनुमोदन के लिए एडिटर को वापस रूट की जाती हैं।

## योगदान करें

हम समुदाय से योगदान का स्वागत करते हैं। पुल रिक्वेस्ट सबमिट करने से पहले कृपया [योगदान गाइड](../../HOW_TO_CONTRIBUTE.md) पढ़ें। कोडबेस के गहन तकनीकी अवलोकन के लिए [Loophole Codebase Guide](../../LOOPHOLE_CODEBASE_GUIDE.md) देखें।

## लाइसेंस

Loophole [GNU Affero General Public License v3.0](../../LICENSE.txt) (AGPL-3.0) के तहत लाइसेंस प्राप्त है। इसमें [Void Editor](https://github.com/voideditor/void) (Apache 2.0) और [VS Code](https://github.com/microsoft/vscode) (MIT) से कोड शामिल है।