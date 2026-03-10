
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import BaseNavigator from './src/navigators/BaseNavigator';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BaseNavigator />
    </Provider>
  );
};

export default App;
