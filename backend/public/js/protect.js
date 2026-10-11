/*
  ВАЖНО (честно, для разработчиков и для вас):
  Ни один сайт не может по-настоящему запретить скриншот — снимок экрана средствами ОС,
  сторонним ПО или второй камерой физически не блокируется браузером. Все меры ниже —
  это СДЕРЖИВАЮЩИЕ факторы против ленивого копипаста и лёгкой утечки, а не гарантия.

  Что реализовано:
  1. Блокировка выделения текста и стандартного копирования/вырезания/контекстного меню.
  2. Подмена буфера обмена предупреждающим текстом, если скопировать всё же получится.
  3. Водяной знак с именем студента и временем поверх текста задания — если он всё же
     сфотографирует экран, это будет видно на скриншоте и его можно будет вычислить.
  4. Реакция на потерю фокуса окна (переключение на скриншотер/другое окно) — контент
     кратковременно размывается.
  5. Попытка среагировать на PrintScreen (по факту браузер не может это отменить,
     но можно затем показать предупреждение и залогировать событие).
*/

function showCopyWarningToast(text) {
  const toast = document.createElement('div');
  toast.className = 'copy-warning-toast';
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function buildWatermarkLayer(label) {
  const layer = document.createElement('div');
  layer.className = 'watermark-layer';
  for (let i = 0; i < 18; i++) {
    const span = document.createElement('span');
    span.textContent = label;
    layer.appendChild(span);
  }
  return layer;
}

/**
 * Оборачивает переданный контейнер защитой от копирования.
 * @param {HTMLElement} el - элемент с текстом задания
 * @param {string} watermarkLabel - обычно "Имя студента · дата/время"
 */
function protectElement(el, watermarkLabel) {
  el.classList.add('protected-content');

  // Водяной знак
  el.appendChild(buildWatermarkLayer(watermarkLabel));

  // Запрет контекстного меню
  el.addEventListener('contextmenu', e => {
    e.preventDefault();
    showCopyWarningToast('Копирование текста задания запрещено правилами колледжа');
  });

  // Запрет выделения
  el.addEventListener('selectstart', e => e.preventDefault());
  el.addEventListener('dragstart', e => e.preventDefault());

  // Подмена буфера обмена при копировании/вырезании
  const spoofClipboard = (e) => {
    e.preventDefault();
    if (e.clipboardData) {
      e.clipboardData.setData(
        'text/plain',
        `Текст задания защищён и не подлежит копированию (${watermarkLabel}).`
      );
    }
    showCopyWarningToast('Копирование заблокировано, в буфер обмена помещено предупреждение');
  };
  el.addEventListener('copy', spoofClipboard);
  el.addEventListener('cut', spoofClipboard);

  // Блокировка горячих клавиш копирования/печати внутри элемента
  el.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === 'c' || k === 'x' || k === 'p' || k === 's')) {
      e.preventDefault();
      showCopyWarningToast('Это действие отключено на странице задания');
    }
  });
}

/**
 * Глобальные обработчики: реакция на потерю фокуса окна (например, при попытке
 * открыть программу для скриншота) и на нажатие PrintScreen.
 * Вызывать один раз при открытии карточки задания, снимать при закрытии.
 */
function installWindowGuards(getProtectedElements) {
  const blurAll = () => {
    getProtectedElements().forEach(el => el.classList.add('blurred-out'));
  };
  const unblurAll = () => {
    getProtectedElements().forEach(el => el.classList.remove('blurred-out'));
  };

  const onBlur = () => blurAll();
  const onFocus = () => setTimeout(unblurAll, 400);
  const onVisibility = () => {
    if (document.hidden) blurAll(); else setTimeout(unblurAll, 400);
  };
  const onKeyUp = (e) => {
    if (e.key === 'PrintScreen') {
      blurAll();
      showCopyWarningToast('Зафиксирована попытка сделать снимок экрана');
      setTimeout(unblurAll, 1500);
    }
  };

  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('keyup', onKeyUp);

  // Возвращаем функцию отписки
  return () => {
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', onFocus);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('keyup', onKeyUp);
  };
}
