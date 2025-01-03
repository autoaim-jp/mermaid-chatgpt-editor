import dotenv from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { OpenAI } from 'openai'
import path from 'path'

const PUBLIC_STATIC_DIR = 'view'
const REGISTER_PROMPT = '/api/postMessage'
const CHAT_HISTORY = '/api/getChatHistory'
const CHAT_LIST = '/api/getChatList'
const mod = {}

const _getDefaultRouter = () => {
  const expressRouter = express.Router()

  const appPath = `${path.dirname(new URL(import.meta.url).pathname)}/`
  expressRouter.use(express.static(appPath + PUBLIC_STATIC_DIR, { index: 'index.html', extensions: ['html'] }))

  expressRouter.use(bodyParser.urlencoded({ extended: true }))
  expressRouter.use(bodyParser.json())
  expressRouter.use(cookieParser())

  return expressRouter
}

const _getFunctionRouter = () => {
  const expressRouter = express.Router()

  // chatgpt
  const registerPromptHandler = getHandlerRegisterPrompt({
    handleRegisterPrompt: handleRegisterPrompt
  })
  expressRouter.post(REGISTER_PROMPT, registerPromptHandler)

  const chatHistoryHandler = getChatHistoryHandler({
    handleChatHistory: handleChatHistory
  })
  expressRouter.get(CHAT_HISTORY, chatHistoryHandler)

  const chatListHandler = getChatListHandler({
    handleChatList: handleChatList
  })
  expressRouter.get(CHAT_LIST, chatListHandler)

  return expressRouter
}

const _getErrorRouter = () => {
  const expressRouter = express.Router()

  expressRouter.get('*', (req, res) => {
    res.status(404)
    return res.end('not found')
  })

  return expressRouter
}

const getHandlerRegisterPrompt = ({ handleRegisterPrompt }) => {
  return async (req, res) => {
    const { chatList } = req.body
    console.log({ debug: true, request: 'ok!', chatList })

    const handleResult = await handleRegisterPrompt({ chatList })

    res.json({ result: handleResult })
  }
}

const getChatHistoryHandler = ({ handleChatHistory }) => {
  return async (req, res) => {
    const { chatIdBefore } = req.query
    console.log({ debug: true, request: 'ok!', chatIdBefore })

    const handleResult = await handleChatHistory({ chatIdBefore })

    res.json({ result: handleResult })
  }
}

const getChatListHandler = ({ handleChatList }) => {
  return async (req, res) => {
    const { chatId } = req.query
    console.log({ debug: true, request: 'ok!', chatId })

    const handleResult = await handleChatList({ chatId })

    res.json({ result: handleResult })
  }
}


const handleRegisterPrompt = async ({ chatList }) => {
  const stream = await mod.openaiClient.chat.completions.create({
    model: 'gpt-4o',
    // model: 'gpt-3.5-turbo',
    messages: chatList,
    stream: true,
    max_tokens: 8192,
  })
  let responseMessage = ''
  for await (const part of stream) {
    // process.stdout.write(part.choices[0]?.delta?.content || '')
    responseMessage += part.choices[0]?.delta?.content || ''
  }

  return responseMessage 
}

const handleChatHistory = async ({ chatIdBefore }) => {
  return [{ chatId: 'abc', chatTitle: 'title abc', }, { chatId: 'xyz', chatTitle: 'title xyz', }]
}

const handleChatList = async ({ chatId }) => {
  return [{"role":"user","content":"適当なmindmapをmermaidで出力して。投資に関するもの。"},{"role":"assistant","content":"もちろん、投資に関するマインドマップの例をMermaidで作成できます。以下に示します。\n\n```mermaid\nmindmap\n  root((投資))\n    資産クラス\n      株式\n        個別株\n        ETF\n        投資信託\n      債券\n        国債\n        社債\n      不動産\n        不動産投資信託(REIT)\n        不動産クラウドファンディング\n      商品\n        金\n        原油\n    投資スタイル\n      短期\n      中長期\n      デイトレード\n    リスク管理\n      分散投資\n      損切り\n      ヘッジ\n    分析手法\n      ファンダメンタルズ分析\n        株価収益率(PER)\n        株価純資産倍率(PBR)\n      テクニカル分析\n        移動平均線\n        RSI\n      マクロ経済分析\n        業種サイクル\n        経済指標\n    株式市場\n      国内市場\n      海外市場\n```\n\nこのマインドマップは、投資に関連する基本的な要素を示していますが、具体的な投資戦略や個別のニーズに応じて詳細を追加することもできます。"}]
}

const startServer = ({ app, port }) => {
  app.listen(port, () => {
    console.log(`listen to port: ${port}`)
  })
}

const init = async () => {
  dotenv.config()
  const OPENAI_CHATGPT_API_KEY = process.env.OPENAI_CHATGPT_API_KEY
  const openaiClient = new OpenAI({
    apiKey: OPENAI_CHATGPT_API_KEY
  })
  mod.openaiClient = openaiClient
}

const main = async () => {
  await app.init()
  const expressApp = express()
  expressApp.disable('x-powered-by')

  expressApp.use(_getDefaultRouter())

  expressApp.use(_getFunctionRouter())

  expressApp.use(_getErrorRouter())

  startServer({ app: expressApp, port: process.env.SERVER_PORT })
}

const app = {
  init,
  main,
}

main()

export default app

