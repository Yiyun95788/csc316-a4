import pandas as pd

df = pd.read_csv('dataset/SpotifyAudioFeaturesApril2019.csv')

print(f"Original: {len(df)} tracks")

quality = df[
    (df['energy'].notna()) & 
    (df['valence'].notna()) & 
    (df['danceability'].notna()) &
    (df['popularity'].notna()) &
    (df['tempo'].notna()) &
    (~df.duplicated(subset=['track_name', 'artist_name'])) &
    (df['popularity'] > 10) &
    (df['tempo'] > 50) & (df['tempo'] < 200) &
    (df['duration_ms'] > 30000) & (df['duration_ms'] < 600000)
].copy()

print(f"After filtering: {len(quality)} tracks")

# Check distribution
print(f"Low pop (<=33): {len(quality[quality['popularity'] <= 33])}")
print(f"Mid pop (34-66): {len(quality[(quality['popularity'] > 33) & (quality['popularity'] <= 66)])}")
print(f"High pop (>66): {len(quality[quality['popularity'] > 66])}")

# Stratified sample with available data
low = quality[quality['popularity'] <= 33].sample(n=min(8000, len(quality[quality['popularity'] <= 33])), random_state=42)
mid = quality[(quality['popularity'] > 33) & (quality['popularity'] <= 66)].sample(n=min(8000, len(quality[(quality['popularity'] > 33) & (quality['popularity'] <= 66)])), random_state=42)
high = quality[quality['popularity'] > 66].sample(n=min(9000, len(quality[quality['popularity'] > 66])), random_state=42)

final = pd.concat([low, mid, high]).sample(frac=1, random_state=42)

print(f"\nFinal: {len(final)} tracks")
final.to_csv('dataset/subset.csv', index=False)