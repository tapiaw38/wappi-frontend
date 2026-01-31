import { authService } from './auth'
import { orderService } from './order'
import { profileService } from './profile'
import { settingsService } from './settings'

class Services {
  authService: typeof authService
  orderService: typeof orderService
  profileService: typeof profileService
  settingsService: typeof settingsService

  constructor() {
    this.authService = authService
    this.orderService = orderService
    this.profileService = profileService
    this.settingsService = settingsService
  }
}

const services = new Services()
export default services
