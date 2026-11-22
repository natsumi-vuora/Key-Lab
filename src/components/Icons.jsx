const I = (d, extra) =>
  function Icon(props) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" {...props}>
        {d}
        {extra}
      </svg>
    );
  };

export const IconPlay = I(<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z" />);
export const IconPause = I(<path d="M6 4h4v16H6zM14 4h4v16h-4z" />);
export const IconStop = I(<rect x="5" y="5" width="14" height="14" rx="2" />);
export const IconLoop = I(<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7Zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4Z" />);
export const IconMetro = I(<path d="M10 2h4l5 19H5L10 2Zm1.6 2-1.3 5h3.4L12.4 4h-.8ZM9.7 11l-1.9 8h8.4l-1.9-8h-1.1l2.8-4.3-1.3-.8-3.3 5.1H9.7Z" />);
export const IconWave = I(<path d="M3 12h2l2-6 3 12 3-9 2 6 2-3h4v2h-3l-3 4.5-2-6-3 9-3-12-1 3.5H3z" />);
export const IconSliders = I(<path d="M5 3h2v6h2v2H3V9h2V3Zm0 10h2v8H5v-8Zm6-10h2v10h2v2H9v-2h2V3Zm0 14h2v4h-2v-4Zm6-14h2v4h2v2h-6V7h2V3Zm0 8h2v10h-2V11Z" />);
export const IconKeys = I(<path d="M3 4h18v16H3V4Zm2 2v12h2.5v-5H7V6H5Zm4 0v7h-.5v5h3v-5H11V6H9Zm4 0v7h-.5v5h3v-5H15V6h-2Zm4 0v7h-.5v5H19V6h-2Z" />);
export const IconCheck = I(<path d="m9.5 16.6-4.1-4.1L4 13.9l5.5 5.5L20 8.9l-1.4-1.4z" />);
export const IconX = I(<path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6 10.6 12 5 6.4z" />);
