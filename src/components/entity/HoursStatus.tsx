import {
    HoursStatus,
    StatusParams,
    isOpen24h,
    isIndefinitelyClosed,
  } from "@yext/sites-react-components";
  import { Hours } from "@yext/types";
  
  export const DisplayHoursStatus = (props: { hours: Hours }) => {
    const { hours } = props;
  
    return <HoursStatus hours={hours} statusTemplate={currentStatus} />;
  };
  
  const currentStatus = (params: StatusParams) => {
    if (isOpen24h(params)) {
      return <span className="HoursStatus-current">24時間営業</span>;
    }
    if (isIndefinitelyClosed(params)) {
      return <span className="HoursStatus-current">休業中</span>;
    }
  
    return (
      <span className="HoursStatus-current">
        {params.isOpen
          ? `営業中 - ${timeStatus(params)}`
          : `営業時間外 - ${timeStatus(params)}`}
      </span>
    );
  };
  
  const timeStatus = (params: StatusParams) => {
    if (isOpen24h(params) || isIndefinitelyClosed(params)) {
      return null;
    }
    let time = "";
    if (params.isOpen) {
      const interval = params.currentInterval;
      time += interval ? interval.getEndTime("ja-JP", params.timeOptions) : "";
    } else {
      const interval = params.futureInterval;
      time += interval ? interval.getStartTime("ja-JP", params.timeOptions) : "";
    }
    return params.isOpen ? `営業終了時間 ${time}` : `開店時間:${time}`;
  };
  