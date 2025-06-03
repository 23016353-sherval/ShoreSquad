# Weather Forecast Integration - ShoreSquad

## Overview

The ShoreSquad website now features a real-time 4-day weather forecast powered by Singapore's National Environment Agency (NEA) API from data.gov.sg. This provides accurate, government-sourced weather data specifically for Singapore to help users plan their beach cleanup activities.

## Features Implemented

### 1. Real-Time Current Weather

- **API Endpoint**: `https://api.data.gov.sg/v1/environment/air-temperature`
- **Data Source**: Multiple weather stations across Singapore
- **Update Frequency**: Every 10 minutes (with caching)
- **Display**: Shows current temperature in Celsius in the hero section

### 2. 24-Hour Weather Forecast

- **API Endpoint**: `https://api.data.gov.sg/v1/environment/24-hour-weather-forecast`
- **Features**: General conditions, temperature range, humidity, wind direction
- **Usage**: Used to determine current cleanup-friendly conditions

### 3. 4-Day Weather Forecast

- **API Endpoint**: `https://api.data.gov.sg/v1/environment/4-day-weather-forecast`
- **Features**:
  - Daily temperature highs and lows (°C)
  - Weather conditions (text description)
  - Humidity ranges
  - Wind direction
  - Cleanup-friendly indicators
  - Weather icons based on conditions

## Technical Implementation

### Weather Service Class

```javascript
class WeatherService {
  constructor() {
    this.baseUrl = "https://api.data.gov.sg/v1/environment";
    this.cache = new Map(); // 10-minute caching
  }

  // Methods:
  // - getWeather(lat, lng) - Current weather
  // - get4DayForecast() - 4-day forecast
  // - processCurrentWeather() - Data processing
  // - process4DayForecast() - Forecast processing
}
```

### Weather Icons

The system automatically selects appropriate Font Awesome icons based on weather conditions:

- ☀️ `fas fa-sun` - Fair/Sunny weather
- ⛅ `fas fa-cloud-sun` - Partly cloudy
- ☁️ `fas fa-cloud` - Cloudy
- 🌧️ `fas fa-cloud-rain` - Showers/Rain
- ⛈️ `fas fa-cloud-bolt` - Thunderstorms

### Cleanup-Friendly Indicators

Each forecast day includes a cleanup recommendation:

- ✅ **Good for cleanup** - No thunderstorms or heavy rain
- ⚠️ **Check conditions** - Thundery showers or heavy rain expected

## UI Components

### Weather Forecast Section

- **Location**: Inserted between Features and Next Cleanup sections
- **Layout**: Responsive grid (4 cards on desktop, 1 column on mobile)
- **Cards Include**:
  - Day name (Today, Tomorrow, or weekday)
  - Date (e.g., "Jun 4")
  - Weather icon
  - Temperature range (high/low in °C)
  - Weather condition description
  - Humidity range
  - Wind direction
  - Cleanup-friendly indicator

### Styling Features

- Ocean-inspired color scheme
- Gradient top borders (green for good weather, coral for warnings)
- Hover animations
- Drop shadow effects
- Mobile-responsive design

## Data Processing

### Temperature Aggregation

- Fetches data from multiple NEA weather stations
- Calculates average temperature across all stations
- Falls back to 28°C if no data available

### Weather Condition Mapping

- Maps NEA's detailed condition descriptions to user-friendly text
- Determines cleanup suitability based on keywords like "thundery" and "heavy"

### Caching Strategy

- **Cache Duration**: 10 minutes
- **Cache Keys**: Location-based for current weather, global for forecasts
- **Fallback**: Mock data if API fails

## API Error Handling

### Robust Fallback System

1. **Primary**: Live NEA API data
2. **Secondary**: Cached data (if available)
3. **Tertiary**: Mock weather data

### Error Scenarios Handled

- Network connectivity issues
- API rate limiting
- Malformed API responses
- CORS restrictions (handled by browser)

## Mobile Responsiveness

### Breakpoints

- **Desktop** (>768px): 4-column grid
- **Tablet** (768px): Auto-fit columns
- **Mobile** (<480px): Single column, stacked details

### Mobile Optimizations

- Simplified forecast details layout
- Larger touch targets
- Optimized font sizes
- Centered weather source attribution

## Performance Optimizations

### Efficient Loading

- Asynchronous API calls
- Progressive enhancement (works without weather data)
- Lazy loading of forecast section
- Cached API responses

### Animation Performance

- CSS transitions for smooth interactions
- GPU-accelerated transforms
- Debounced scroll events

## Data Source Attribution

**Weather data provided by Singapore's National Environment Agency (NEA)**

- Source: https://data.gov.sg
- Real-time updates from government weather stations
- Compliant with data.gov.sg usage policies

## Future Enhancements

### Potential Improvements

1. **Hourly Forecast**: Add detailed hourly weather for cleanup planning
2. **Weather Alerts**: Push notifications for severe weather
3. **Historical Data**: Show weather trends for planning
4. **Air Quality**: Integrate PSI (Pollutant Standards Index) data
5. **UV Index**: Add UV radiation warnings for outdoor activities
6. **Location Services**: Auto-detect user location for localized weather

### Additional NEA APIs Available

- Air quality (PSI readings)
- UV index
- Rainfall data
- Wind speed and direction
- Relative humidity

## Testing

### Browser Testing

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ API failure scenarios
- ✅ Network connectivity issues

### API Testing

- ✅ Live API endpoints
- ✅ Response format validation
- ✅ Error handling
- ✅ Cache functionality

## Deployment Notes

### CORS Considerations

- NEA APIs support CORS for browser requests
- No server-side proxy required
- Works with static site hosting

### API Key Requirements

- **None required** - NEA APIs are publicly accessible
- Rate limiting may apply for high-traffic sites
- Consider implementing request throttling for production

## Accessibility

### Screen Reader Support

- Semantic HTML structure
- ARIA labels for weather icons
- Alt text for visual elements
- Keyboard navigation support

### Visual Accessibility

- High contrast color schemes
- Clear typography
- Icon + text combinations
- Responsive text sizing
