function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map((part) => parseInt(part, 10))
  return hours * 60 + minutes
}

/** Handles same-day hours and overnight ranges (e.g. 10:00–02:00). */
function isOpenNow(timeNow: number, open: number, close: number): boolean {
  if (close > open) {
    return timeNow >= open && timeNow < close
  }
  return timeNow >= open || timeNow < close
}

export function getShopStatus(hours: any[]) {
  if (!hours || hours.length === 0) {
    return null
  }

  const now = new Date()
  const day = now.getDay()
  const timeNow = now.getHours() * 60 + now.getMinutes()

  const current = hours.find((h) => h.dayOfWeek === day)
  if (!current) {
    return null
  }

  if (!current.isClosed) {
    const open = parseTimeToMinutes(current.openTime)
    const close = parseTimeToMinutes(current.closeTime)

    if (isOpenNow(timeNow, open, close)) {
      return {
        open: true,
        closeTime: current.closeTime,
      }
    }
  }

  // Early morning may still be within yesterday's overnight window
  const prevDay = (day + 6) % 7
  const previous = hours.find((h) => h.dayOfWeek === prevDay)
  if (previous && !previous.isClosed) {
    const prevOpen = parseTimeToMinutes(previous.openTime)
    const prevClose = parseTimeToMinutes(previous.closeTime)

    if (prevClose <= prevOpen && isOpenNow(timeNow, prevOpen, prevClose)) {
      return {
        open: true,
        closeTime: previous.closeTime,
      }
    }
  }

  if (current.isClosed) {
    return {
      open: false,
    }
  }

  return {
    open: false,
    openTime: current.openTime,
  }
}