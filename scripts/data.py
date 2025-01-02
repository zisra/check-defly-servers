import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import argparse

# Argument parser setup
parser = argparse.ArgumentParser(description='Game-mode')
parser.add_argument('--mode', choices=['teams', 'defuse'], required=True, help='Game-mode')
args = parser.parse_args()

# File path and data loading
file_path = f'./data/{args.mode}.csv'
df = pd.read_csv(file_path)

df['time'] = pd.to_datetime(df['time'])

# Filter out closed servers
df = df[df['players'] != -1]

# Calculate average players per day
df['date'] = df['time'].dt.date
daily_mean = df.groupby('date')['players'].mean().reset_index()

# Calculate average players for each time interval
df['time_only'] = df['time'].dt.strftime('%H:%M')
time_avg = df.groupby('time_only')['players'].mean().reset_index()

# Calculate average players by weekday
df['weekday'] = df['time'].dt.day_name()
weekday_avg = df.groupby('weekday')['players'].mean().reset_index()
weekday_avg['weekday'] = pd.Categorical(weekday_avg['weekday'], categories=[
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], ordered=True)
weekday_avg = weekday_avg.sort_values('weekday')

# Plotting
plt.figure(figsize=(14, 12))

# Subplot 1: Cumulative players per day
plt.subplot(3, 1, 1)
plt.plot(daily_mean['date'], daily_mean['players'], marker='o', color='orange', label='Average Players')
plt.title(f'Average Players Per Day: {args.mode.capitalize()}')
plt.xlabel('Date')
plt.ylabel('Average Number of Players')
plt.xticks(rotation=45)
plt.tight_layout()

# Subplot 2: Average players by time of day
plt.subplot(3, 1, 2)
plt.plot(time_avg['time_only'], time_avg['players'], marker='o', color='green', label='Time Interval Average')
plt.title(f'Average Players by Time of Day: {args.mode.capitalize()}')
plt.xlabel('Time of Day')
plt.ylabel('Average Number of Players')
plt.xticks(rotation=45)
plt.tight_layout()

# Subplot 3: Average players by weekday
y_min = weekday_avg['players'].min()
y_max = weekday_avg['players'].max()

plt.subplot(3, 1, 3)
plt.plot(weekday_avg['weekday'], weekday_avg['players'], marker='o', linestyle='-', color='purple', label='Weekday Average')
plt.title(f'Average Players by Weekday: {args.mode.capitalize()}')
plt.xlabel('Weekday')
plt.ylabel('Average Number of Players')
plt.ylim(bottom=y_min - 0.5, top=y_max + 0.5)
plt.yticks(np.arange(y_min - 0.5, y_max + 1, 0.5))
plt.grid(axis='y', linestyle='--', linewidth=0.7)
plt.tight_layout()

plt.savefig(f'./plots/{args.mode}_plot.png')