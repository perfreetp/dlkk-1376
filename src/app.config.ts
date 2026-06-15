export default defineAppConfig({
  pages: [
    'pages/today/index',
    'pages/medicine/index',
    'pages/reminder/index',
    'pages/health/index',
    'pages/family/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#ff7a45',
    navigationBarTitleText: '贴心药盒',
    navigationBarTextStyle: 'white',
    backgroundColor: '#fff7f2'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#ff7a45',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/today/index',
        text: '今日用药'
      },
      {
        pagePath: 'pages/medicine/index',
        text: '药盒清单'
      },
      {
        pagePath: 'pages/reminder/index',
        text: '提醒设置'
      },
      {
        pagePath: 'pages/health/index',
        text: '健康记录'
      },
      {
        pagePath: 'pages/family/index',
        text: '家属协同'
      }
    ]
  }
})
