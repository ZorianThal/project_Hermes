import React, { useState, useEffect } from 'react';
import {
  Download,
  Monitor,
  Terminal,
  FileCode,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  X,
  Copy,
  Check,
} from 'lucide-react';

interface DesktopDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopDownloadModal: React.FC<DesktopDownloadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedBatch, setCopiedBatch] = useState<boolean>(false);
  const [copiedPs, setCopiedPs] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'В вашем браузере нажмите на иконку "Установить" в правой части адресной строки Chrome / Edge / Brave или меню браузера (⋮) -> "Установить Hell_Gate".'
      );
    }
  };

  const currentOrigin = window.location.origin;

  const copyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-text">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-900 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 via-indigo-600 to-rose-600 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Monitor className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 tracking-wide flex items-center gap-2">
                УСТАНОВКА И СКАЧИВАНИЕ HELL_GATE DESKTOP
              </h3>
              <p className="text-[11px] text-slate-400">
                Запуск в виде автономного окна Windows / Mac / Linux с доступом к ПК
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-200">
          {/* Method 1: Instant 1-Click Desktop Launcher for Windows / Firefox / Edge */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/50 via-slate-900/70 to-slate-950 border border-indigo-500/60 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <span className="font-bold text-sm text-indigo-200">
                  Скачать готовый файл запуска (.BAT / .VBS для Windows)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                100% Работает в Firefox
              </span>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              В Firefox установка PWA по умолчанию отключена разработчиками Mozilla. Поэтому скачайте готовый файл запуска — при клике он автоматически запускает Hell_Gate как отдельное окно на вашем компьютере:
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="/api/desktop/download-installer?type=bat"
                download="Hell_Gate_Desktop_Launcher.bat"
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 via-cyan-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-950"
              >
                <Download className="w-4 h-4" />
                <span>Скачать Hell_Gate_Launcher.bat</span>
              </a>

              <a
                href="/api/desktop/download-installer?type=vbs"
                download="Hell_Gate_Desktop.vbs"
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs flex items-center gap-1.5 transition border border-cyan-800/60"
                title="Запуск без мигания черного окна консоли"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Тихий запуск (.vbs)</span>
              </a>

              <a
                href="/api/desktop/download-installer?type=powershell"
                download="Install_Hell_Gate_Windows.ps1"
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition border border-slate-700"
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>Создать ярлык на рабочем столе (.ps1)</span>
              </a>
            </div>
            <div className="text-[10px] text-slate-400 pt-0.5">
              💡 <b>Совет:</b> Сохраните скачанный <code>Hell_Gate_Desktop_Launcher.bat</code> на Рабочий стол или в автозагрузку.
            </div>
          </div>

          {/* Method 2: PWA Browser Installation (Chrome / Edge / Brave) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <span className="font-bold text-slate-200">
                  Установка через браузер (Chrome / Edge / Brave / Safari)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                PWA Engine
              </span>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Firefox не поддерживает API прямого вызова <code>beforeinstallprompt</code> на десктопе. Если открыть эту же ссылку в Google Chrome, Microsoft Edge или Brave — браузер позволит нажать «Установить Hell_Gate» прямо из адресной строки.
            </p>

            <button
              onClick={handleInstallPWA}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 transition border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Попробовать установить PWA в этом браузере</span>
            </button>
          </div>

          {/* Method 3: Compile into Standalone Native .EXE (Electron / Node) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <span className="font-bold text-slate-200">
                  Сборка в автономный бинарный файл (.EXE)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Electron Builder
              </span>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Если вам требуется физический файл <code>Hell_Gate.exe</code> без браузера:
            </p>

            <div className="bg-black/80 rounded-lg p-3 border border-slate-800 font-mono text-[11px] space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-[10px]">
                <span>Команда для сборки .exe в терминале:</span>
                <button
                  onClick={() =>
                    copyText(
                      'npm install electron electron-builder --save-dev && npx electron-builder --win portable',
                      setCopiedBatch
                    )
                  }
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300"
                >
                  {copiedBatch ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBatch ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <code className="text-amber-300 block select-all">
                npm install electron electron-builder --save-dev && npx electron-builder --win portable
              </code>
            </div>

            <div className="pt-1">
              <a
                href="/api/desktop/download-installer?type=electron-script"
                download="Build_Standalone_Exe.bat"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Скачать авто-скрипт сборки Build_Standalone_Exe.bat</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-900 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Project_Fenrir // Hell_Gate Sovereign Desktop Client</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
