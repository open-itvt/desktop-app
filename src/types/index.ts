export interface Channel {
  name: string
  currentProgram: string
  timeRange: string
}

export interface EpgEntry {
  time: string
  title: string
  isLive: boolean
}

export interface VodItem {
  id: number
  title: string
  programName: string
  part: number
  programSlug: string
  videoName: string
  claimId: string
  thumbnailUrl: string
  date: string | undefined
  releaseTime: number
  views: number
}

export interface UpcomingProgram {
  time: string
  title: string
}

export interface NavItem {
  label: string
  icon: string
  route: string
}
