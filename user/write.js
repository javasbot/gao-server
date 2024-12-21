const axios = require("axios");
const githubConfig = require("./githubConfig");
const { getDirectoryContents, sendJsonResponse } = require("./commonConfig");
const { GITHUB_TOKEN, REPO_OWNER, REPO_NAME, BRANCH } = githubConfig;

// 设置超时时间
const axiosInstance = axios.create({
  timeout: 10000, // 10秒超时
});

const createOrUpdateFile = async (path, content, message) => {
  console.log("创建");
  const existingContent = await getDirectoryContents(path);
  let sha = null;

  if (existingContent) {
    const file = existingContent.find((item) => item.name === "README.md");
    if (file) {
      sha = file.sha;
    }
  }

  const encodedContent = Buffer.from(content).toString("base64");

  try {
    const response = await axiosInstance.put(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        message,
        content: encodedContent,
        branch: BRANCH,
        sha,
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
      }
    );
    console.log("Response from 新建结构:", response.data);
  } catch (error) {
    console.error(
      "新建报错:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

const createDirectory = async (path) => {
  await createOrUpdateFile(
    `${path}/README.md`,
    "# Directory",
    "Create directory"
  );
};

const handleWrite = async (req, res, postData) => {
  try {
    const { category, title, content } = postData;

    if (!category || !title || !content) {
      sendJsonResponse(res, 400, {
        success: false,
        message: "Category, title, and content are required",
      });
      return;
    }

    const path = `${category}/${title}.md`;

    // 检查目录是否存在，如果不存在则创建
    const directoryExists = await getDirectoryContents(category);
    if (!directoryExists) {
      await createDirectory(category);
    }

    // 将文章保存到 GitHub
    await createOrUpdateFile(path, content, `Add ${title} article`);

    // 发送成功响应
    sendJsonResponse(res, 200, {
      success: true,
      message: "Article published successfully",
    });
  } catch (error) {
    console.error("Error in handleWrite:", error); // 添加详细的错误日志
    sendJsonResponse(res, 500, {
      success: false,
      message: "Failed to publish article",
    });
  }
};

module.exports = handleWrite;
