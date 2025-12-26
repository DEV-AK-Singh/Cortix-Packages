export interface Detector<T> {
  name: string
  detect(repoPath: string): Promise<DetectorResult<T>>
}

export interface DetectorResult<T> {
  success: boolean
  data?: T
  warnings?: string[]
}
