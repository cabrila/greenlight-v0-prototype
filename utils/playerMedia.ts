import { getVideoPlatform } from "./videoUtils"

/**
 * Shared helpers for enumerating an actor's player media so the Configure
 * modal and the Player View agree on stable media ids and default names.
 *
 * Media id conventions:
 *   image slides -> `img:<index>` (index into the actor's headshots array)
 *   videos       -> `vid:<url>`
 */

export interface PlayerImageSlide {
  key: string
  url: string
  defaultName: string
}

export interface PlayerVideoSlide {
  key: string
  name: string
  url: string
  platform?: "vimeo" | "youtube"
  videoId?: string
  taggedActorNames: string[]
  markIn?: number
  markOut?: number
  videoPassword?: string
}

/** Image slides for an actor, in headshot order. */
export function getActorImageSlides(actor: any): PlayerImageSlide[] {
  const headshots: string[] = actor?.headshots || []
  return headshots.map((url, i) => ({
    key: `img:${i}`,
    url,
    defaultName: `Photo ${i + 1}`,
  }))
}

/** Video/media slides for an actor. Mirrors the Player View media library. */
export function getActorVideoSlides(actor: any): PlayerVideoSlide[] {
  const media: PlayerVideoSlide[] = []
  if (!actor) return media

  if (actor.mediaMaterials) {
    actor.mediaMaterials.forEach((material: any) => {
      media.push({
        key: `vid:${material.url}`,
        name: material.name,
        url: material.url,
        platform: getVideoPlatform(material.url) || undefined,
        taggedActorNames: material.taggedActorNames || [],
      })
    })
  }

  if (actor.showreels) {
    actor.showreels.forEach((reel: any) => {
      media.push({
        key: `vid:${reel.url}`,
        name: `Showreel: ${reel.name}`,
        url: reel.url,
        platform: getVideoPlatform(reel.url) || undefined,
        taggedActorNames: reel.taggedActorNames || [],
      })
    })
  }

  if (actor.auditionTapes) {
    actor.auditionTapes.forEach((tape: any) => {
      media.push({
        key: `vid:${tape.url}`,
        name: `Audition: ${tape.name}`,
        url: tape.url,
        platform: getVideoPlatform(tape.url) || undefined,
        taggedActorNames: tape.taggedActorNames || [],
      })
    })
  }

  if (actor.vimeoVideos) {
    actor.vimeoVideos.forEach((video: any) => {
      media.push({
        key: `vid:${video.url}`,
        name: video.title || `Video ${video.videoId}`,
        url: video.url,
        platform: video.platform,
        videoId: video.videoId,
        taggedActorNames: video.taggedActorNames || [],
        markIn: video.markIn,
        markOut: video.markOut,
        videoPassword: video.videoPassword,
      })
    })
  }

  if (actor.youtubeVideos) {
    actor.youtubeVideos.forEach((video: any) => {
      media.push({
        key: `vid:${video.url}`,
        name: video.title || `YouTube Video ${video.videoId}`,
        url: video.url,
        platform: video.platform,
        videoId: video.videoId,
        taggedActorNames: video.taggedActorNames || [],
        markIn: video.markIn,
        markOut: video.markOut,
        videoPassword: video.videoPassword,
      })
    })
  }

  return media
}
