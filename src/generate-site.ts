import { generatePages } from "./generate-pages"
import { siteMap } from "./sitemap"

async function generateSite () {
  await generatePages(siteMap.nav)
}

generateSite().catch(e => {
  console.error(e)
})
