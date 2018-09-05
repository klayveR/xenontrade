"""
Script using the Windows API to register for window focus changes and print the
titles of newly focused windows.
"""

import sys
import time
import ctypes
import ctypes.wintypes
import threading


class ObservableWindowChange(object):
    def __init__(self):
        self.__observers = []

    def register_observer(self, observer):
        self.__observers.append(observer)

    def notify_observers(self, *args, **kwargs):
        win_title = ''.join(args)
        if win_title == '':
            return ''
        for observer in self.__observers:
            observer.notify(win_title)

    def start_event_listener(self):
        # Create a WindowChangeEventListener object with this instance of
        # ObservableWindowChange as a parameter (self)
        listener = WindowChangeEventListener(self)
        listener.listen_forever()


class IWindowChangeObserver(object):
    """
    Base class for observing window changes
    """
    def __init__(self, observable):
        observable.register_observer(self)

    def notify(self, win_title):
        raise NotImplementedError


class WindowChangeEventListener(object):
    """
    WindowChangeEventListener
    """
    def __init__(self, observable):
        self.observable = observable

    def listen_forever(self):
        # Look here for DWORD event constants:
        # http://stackoverflow.com/questions/15927262/convert-dword-event-constant-from-wineventproc-to-name-in-c-sharp
        # Don't worry, they work for python too.
        EVENT_SYSTEM_DIALOGSTART = 0x0010
        WINEVENT_OUTOFCONTEXT = 0x0000
        EVENT_SYSTEM_FOREGROUND = 0x0003
        WINEVENT_SKIPOWNPROCESS = 0x0002

        user32 = ctypes.windll.user32
        ole32 = ctypes.windll.ole32
        EnumWindows = ctypes.windll.user32.EnumWindows
        EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool,
                                             ctypes.POINTER(ctypes.c_int),
                                             ctypes.POINTER(ctypes.c_int))
        GetWindowText = ctypes.windll.user32.GetWindowTextW
        GetWindowTextLength = ctypes.windll.user32.GetWindowTextLengthW
        IsWindowVisible = ctypes.windll.user32.IsWindowVisible

        ole32.CoInitialize(0)

        WinEventProcType = ctypes.WINFUNCTYPE(
            None,
            ctypes.wintypes.HANDLE,
            ctypes.wintypes.DWORD,
            ctypes.wintypes.HWND,
            ctypes.wintypes.LONG,
            ctypes.wintypes.LONG,
            ctypes.wintypes.DWORD,
            ctypes.wintypes.DWORD
        )

        def callback(hWinEventHook, event, hwnd, idObject, idChild, dwEventThread,
                     dwmsEventTime):
            length = GetWindowTextLength(hwnd)
            buff = ctypes.create_unicode_buffer(length + 1)
            GetWindowText(hwnd, buff, length + 1)

            # Notify observers
            self.observable.notify_observers(buff.value)

        WinEventProc = WinEventProcType(callback)

        user32.SetWinEventHook.restype = ctypes.wintypes.HANDLE
        hook = user32.SetWinEventHook(
            EVENT_SYSTEM_FOREGROUND,
            EVENT_SYSTEM_FOREGROUND,
            0,
            WinEventProc,
            0,
            0,
            WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS
        )
        if hook == 0:
            print('SetWinEventHook failed')
            exit(1)

        msg = ctypes.wintypes.MSG()
        while user32.GetMessageW(ctypes.byref(msg), 0, 0, 0) != 0:
            user32.TranslateMessageW(msg)
            user32.DispatchMessageW(msg)

        # Stopped receiving events, so clear up the winevent hook and uninitialise.
        print('Stopped receiving new window change events. Exiting...')
        user32.UnhookWinEvent(hook)
        ole32.CoUninitialize()


class WindowObserver(IWindowChangeObserver):
    def notify(self, win_title):
        print("focus:'%s'" % win_title)
        sys.stdout.flush()


if __name__ == '__main__':

    def run():
        # Create an observable and an observer observing it
        subject = ObservableWindowChange()
        observer = WindowObserver(subject)

        # Listen for window changes
        subject.start_event_listener()

    # Start the 'run' method in a daemonized thread.
    t = threading.Thread(target=run)
    t.setDaemon(True)
    t.start()

    # Keep the main thread running in a sleep loop until ctrl+c (SIGINT) is caught.
    # Once the main thread terminates, all daemon threads will automatically
    # terminate.
    while True:
        try:
            time.sleep(0.1)
        except KeyboardInterrupt:
            break
