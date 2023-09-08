const http = require("http");
const https = require("https");

const timeUrl = "https://time.com";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/getTimeStories") {
    fetchLatestStories(res);
  } else {
    handleNotFound(res);
  }
});

const fetchLatestStories = (res) => {
  
  https
    .get(timeUrl, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        if (response.statusCode === 200) {
          const latestStories = extractLatestStories(data);

          if (latestStories.length > 0) {
            sendJsonResponse(res, 200, latestStories.slice(0, 6));
          } else {
            sendJsonResponse(res, 500, {
              error: "Latest stories section not found on the page",
            });
          }
        } else {
          sendJsonResponse(res, response.statusCode, {
            error: "Failed to fetch data from Time.com",
          });
        }
      });
    })
    .on("error", (error) => {
      console.error("Error:", error);
      sendJsonResponse(res, 500, { error: "Internal server error" });
    });
};

const extractLatestStories = (htmlData) => {
  const latestStories = [];
  const startMarker = '<div class="partial latest-stories"';
  const endMarker = "</ul>";
  const startIndex = htmlData.indexOf(startMarker);
  const endIndex = htmlData.indexOf(endMarker, startIndex);

  if (startIndex !== -1 && endIndex !== -1) {
    const latestStoriesHtml = htmlData.substring(startIndex, endIndex);
    const titleRegex = /<h3 class="latest-stories__item-headline">([^<]+)<\/h3>/g;
    const linkRegex = /<a href="([^"]+)">/g;
    let match;

    while ((match = titleRegex.exec(latestStoriesHtml)) !== null) {
      const title = match[1].trim();
      const linkMatch = linkRegex.exec(latestStoriesHtml);

      if (linkMatch) {
        const link = `${timeUrl}${linkMatch[1]}`;
        latestStories.push({ title, link });
      }
    }
  }

  return latestStories;
};

const sendJsonResponse = (res, statusCode, data) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

const handleNotFound = (res) => {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Page Not Found");
};

const port = 3000;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
