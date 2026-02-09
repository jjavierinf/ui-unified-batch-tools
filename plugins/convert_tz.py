def convert_utc_to_et(value,target_timezone='US/Eastern'):
    import pendulum
    dt = pendulum.parse(value)
    # return 'dt.in_tz('US/Eastern').to_datetime_string()'
    return dt.in_tz(target_timezone).to_datetime_string()

def convert_utc_to_utc(value):
    import pendulum
    dt = pendulum.parse(value)
    return dt.in_tz('UTC').to_datetime_string()