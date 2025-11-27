import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * リモート画像をダウンロードしてsrc/assetsディレクトリに保存
 * @param imageUrl - ダウンロードする画像のURL
 * @param fileName - 保存するファイル名（拡張子なし）
 * @returns 保存された画像のパス（assetsからの相対パス）
 */
export async function downloadImage(
  imageUrl: string,
  fileName: string
): Promise<string | null> {
  try {
    // src/assets/covers ディレクトリを作成
    const assetsDir = path.join(__dirname, '../../../src/assets/covers');

    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // 画像をフェッチ
    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error(`Failed to fetch image: ${imageUrl} - Status: ${response.status}`);
      return null;
    }

    // Content-Typeから拡張子を判断
    const contentType = response.headers.get('content-type') || '';
    let ext = '.jpg'; // デフォルト

    if (contentType.includes('png')) {
      ext = '.png';
    } else if (contentType.includes('webp')) {
      ext = '.webp';
    } else if (contentType.includes('gif')) {
      ext = '.gif';
    } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      ext = '.jpg';
    }

    // ファイル名を生成（slugベース + 拡張子）
    const sanitizedFileName = fileName.replace(/[^a-z0-9-]/gi, '_');
    const fullFileName = `${sanitizedFileName}${ext}`;
    const filePath = path.join(assetsDir, fullFileName);

    // 既に存在する場合はスキップ
    if (fs.existsSync(filePath)) {
      console.log(`Image already exists: ${fullFileName}`);
      return fullFileName;
    }

    // 画像データを取得してファイルに保存
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(filePath, buffer);

    console.log(`✓ Downloaded cover image: ${fullFileName}`);

    // ファイル名のみを返す（glob importで使用）
    return fullFileName;
  } catch (error) {
    console.error(`Failed to download image from ${imageUrl}:`, error);
    return null;
  }
}

/**
 * 複数の画像を並列でダウンロード
 */
export async function downloadImages(
  images: Array<{ url: string; fileName: string }>
): Promise<Map<string, string>> {
  const results = await Promise.all(
    images.map(async ({ url, fileName }) => {
      const localPath = await downloadImage(url, fileName);
      return { url, localPath };
    })
  );

  const imageMap = new Map<string, string>();
  results.forEach(({ url, localPath }) => {
    if (localPath) {
      imageMap.set(url, localPath);
    }
  });

  return imageMap;
}
