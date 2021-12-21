import ELTablePlus from './src/ELTablePlus';

/* istanbul ignore next */
ELTablePlus.install = function (Vue) {
  Vue.component(Alert.name, Alert);
};

export default ELTablePlus;
