export function wrapperEnv(envConf: Record<string, string>): ViteEnv {
  const ret: Record<string, any> = {}

  for (const [key, value] of Object.entries(envConf)) {
    if (value === 'true') ret[key] = true
    else if (value === 'false') ret[key] = false
    else ret[key] = value
  }

  const nodeEnv = envConf.VITE_USER_NODE_ENV
  if (nodeEnv === 'development' || nodeEnv === 'production' || nodeEnv === 'test') {
    ret.VITE_USER_NODE_ENV = nodeEnv
  }

  return ret as ViteEnv
}
