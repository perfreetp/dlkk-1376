import { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useAppStore } from '@/store';
// 全局样式
import './app.scss';

function App(props) {
  const init = useAppStore(state => state.init);
  const checkMissedStatus = useAppStore(state => state.checkMissedStatus);
  const checkAndTriggerReminders = useAppStore(state => state.checkAndTriggerReminders);
  const refreshTodayRecords = useAppStore(state => state.refreshTodayRecords);

  useEffect(() => {
    init();
  }, [init]);

  useDidShow(() => {
    console.log('[App] 应用回到前台');
    setTimeout(() => {
      refreshTodayRecords();
      setTimeout(() => {
        checkMissedStatus();
        if (useAppStore.getState().settings.reminder.enabled) {
          checkAndTriggerReminders();
        }
      }, 200);
    }, 100);
  });

  useDidHide(() => {
    console.log('[App] 应用进入后台');
  });

  return props.children;
}

export default App;
