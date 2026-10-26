import dashboardService from './dashboard.services.js'

export const getDashboard = async (req, res, next) => {
  try {
    const dashboardData = await dashboardService.getDashboardData()

    res.status(200).json({
      success: true,
      message: 'Dashboard data fetched successfully',
      data: dashboardData,
    })
  } catch (error) {
    next(error)
  }
}

export const getPerformance = async (req, res, next) => {
  try {
    const performanceData = await dashboardService.getPerformanceData()
    res.status(200).json({
      success: true,
      message: 'Performance data fetched successfully',
      data: performanceData,
    })
  } catch (error) {
    next(error)
  }
}